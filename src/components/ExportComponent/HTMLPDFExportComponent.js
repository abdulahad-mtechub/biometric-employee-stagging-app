import React from 'react';
import {TouchableOpacity, Text, Alert} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

const HTMLPDFExportComponent = ({
  data = [],
  columns = [],
  fileName = 'export',
  title = 'Export',
  buttonTitle = 'Export to PDF',
}) => {
  const generateTableHTML = () => {
    if (data.length === 0) {
      return `
        <div style="text-align: center; padding: 50px;">
          <h2>${title}</h2>
          <p>No Data Available</p>
        </div>
      `;
    }

    const tableHeaders = columns
      .map(
        col =>
          `<th style="border: 1px solid #ddd; padding: 12px; background-color: #f2f2f2; text-align: left;">${col.label}</th>`,
      )
      .join('');

    const tableRows = data
      .map(
        row => `
      <tr>
        ${columns
          .map(
            col =>
              `<td style="border: 1px solid #ddd; padding: 12px;">${
                row[col.key] || '-'
              }</td>`,
          )
          .join('')}
      </tr>
    `,
      )
      .join('');

    return `
      <div style="font-family: Arial, sans-serif;">
        <h1 style="text-align: center; color: #003149;">${title}</h1>
        <p style="text-align: center; color: #666;">Generated on: ${new Date().toLocaleDateString()}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    `;
  };

  const handleExportPDF = async () => {
    try {
      const html = generateTableHTML();

      const options = {
        html,
        fileName: fileName,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);

      // Share the PDF file
      await Share.open({
        url: `file://${file.filePath}`,
        type: 'application/pdf',
        filename: `${fileName}.pdf`,
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      Alert.alert('Error', 'Failed to export PDF');
    }
  };

  return (
    <TouchableOpacity
      style={{
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
      }}
      onPress={handleExportPDF}>
      <Text style={{color: 'white', fontSize: 16, fontWeight: '600'}}>
        {buttonTitle}
      </Text>
    </TouchableOpacity>
  );
};

export default HTMLPDFExportComponent;
