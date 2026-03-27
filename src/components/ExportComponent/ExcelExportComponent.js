import React from 'react';
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {useTranslation} from 'react-i18next';
import Share from 'react-native-share';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';

const ExcelExportComponent = {
  requestStoragePermission: async (t = s => s) => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: t('Storage Permission Required'),
            message: t(
              'This app needs access to your storage to save Excel files',
            ),
            buttonPositive: t('OK'),
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  },

  formatCellData: (data, key, t = s => s) => {
    if (!data) return '';

    if (key.includes('date') || key.includes('Date')) {
      return ExcelExportComponent.formatDate(data, t);
    }

    if (key === 'file_type') {
      return String(data).toUpperCase();
    }

    if (key === 'status') {
      return t(String(data).charAt(0).toUpperCase() + String(data).slice(1));
    }

    return t(String(data) || '');
  },

  formatDate: (dateString, t = s => s) => {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      // You may want to localize the date format as well
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  },

  exportToExcel: async ({
    data = [],
    columns = [],
    fileName = 'export',
    title = 'Export',
    onExportStart,
    onExportSuccess,
    onExportError,
    showShareDialog = false, // Changed default to false
    maxColumns = 5,
    t: tProp,
  }) => {
    // Use translation function from prop or fallback
    let t = tProp;
    if (!t) {
      try {
        // Try to get t from useTranslation if available
        // This is a static object, so fallback to identity if not available
        // eslint-disable-next-line react-hooks/rules-of-hooks
        t = typeof useTranslation === 'function' ? useTranslation().t : s => s;
      } catch {
        t = s => s;
      }
    }
    try {
      onExportStart?.();

      // Request storage permission
      const hasPermission = await ExcelExportComponent.requestStoragePermission(
        t,
      );
      if (!hasPermission) {
        Alert.alert(
          t('Permission Denied'),
          t('Storage permission is required to export Excel files'),
        );
        return;
      }

      const processedColumns = columns.slice(0, maxColumns);

      const excelData = [];

      excelData.push([t(title).toUpperCase()]);
      excelData.push([
        `${t('Generated on')}: ${new Date().toLocaleDateString()}`,
      ]);
      excelData.push([]);

      const headers = processedColumns.map(col => t(col.label || col.key));
      excelData.push(headers);

      // Add data rows
      if (data && data.length > 0) {
        data.forEach(row => {
          const rowData = processedColumns.map(col =>
            ExcelExportComponent.formatCellData(row[col.key], col.key, t),
          );
          excelData.push(rowData);
        });

        // Add summary row
        excelData.push([]);
        excelData.push([`${t('Total Records')}: ${data.length}`]);
      } else {
        excelData.push([t('No Data Available')]);
      }

      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // Set column widths
      const colWidths = processedColumns.map(() => ({wch: 20}));
      ws['!cols'] = colWidths;

      // Style the title row (if XLSX supports it)
      if (ws['A1']) {
        ws['A1'].s = {
          font: {bold: true, sz: 16},
          alignment: {horizontal: 'center'},
        };
      }

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, t('Export'));

      // Generate Excel file
      const wbout = XLSX.write(wb, {type: 'base64', bookType: 'xlsx'});

      // Save file
      const timestamp = Date.now();
      const fullFileName = `${fileName}_${timestamp}.xlsx`;
      const documentsPath =
        Platform.OS === 'android'
          ? RNFS.DownloadDirectoryPath
          : RNFS.DocumentDirectoryPath;
      const filePath = `${documentsPath}/${fullFileName}`;

      await RNFS.writeFile(filePath, wbout, 'base64');

      onExportSuccess?.(filePath);

      Alert.alert(
        t('Export Successful'),
        `${t('Excel file has been saved to')}:\n${filePath}`,
        [{text: t('OK')}],
      );

      return filePath;
    } catch (error) {
      console.error('Excel Export Error:', error);
      onExportError?.(error);
      Alert.alert(
        t('Export Failed'),
        t('There was an error exporting the Excel file.'),
        [{text: t('OK')}],
      );
    }
  },
};

export default ExcelExportComponent;
