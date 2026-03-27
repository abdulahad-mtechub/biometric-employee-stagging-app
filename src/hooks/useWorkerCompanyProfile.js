import {useState, useEffect} from 'react';
import {useSelector} from 'react-redux';
import {API_BASE_URL} from '../Constants/Base_URL';
import {getCompanyProfile} from '../Constants/api';

export const useWorkerCompanyProfile = () => {
  const [companyData, setCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = useSelector(state => state?.auth?.user?.token);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await getCompanyProfile(token);

      const companyAdmin = response.data.company_admin;

      const company = companyAdmin?.company || {};
      const admin = companyAdmin?.admin || {};

      let companyLogoBase64 = '';
      if (company?.logo) {
        try {
          const logoUrl = company.logo.startsWith('http')
            ? company.logo
            : `${API_BASE_URL.replace('/api/', '')}${company.logo}`;
          const logoResponse = await fetch(logoUrl);
          const logoBlob = await logoResponse.blob();
          const base64 = await convertBlobToBase64(logoBlob);
          companyLogoBase64 = base64;
        } catch (logoError) {
          console.warn('⚠️ Failed to fetch company logo:', logoError);
        }
      }

      const formattedData = {
        companyName: company?.name || '',
        companyAddress: company?.address || '',
        companyEmail: company?.email || admin?.email || '',
        companyPhone: company?.phone || '',
        companyLogo: companyLogoBase64,
        authorizedSignatory: admin?.name || '',
        companyContact: company?.contact_person || '',
      };

      setCompanyData(formattedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  return {
    companyData,
    loading,
    error,
    refetch: fetchCompanyProfile,
  };
};

// Helper function to convert blob to base64
const convertBlobToBase64 = blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
