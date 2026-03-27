export const adminValidation = data => {
  try {
    const {
      adminName = '',
      adminEmail = '',
      phoneNumber = '',
      image = null,
    } = data || {};

    if (typeof adminName !== 'string' || !adminName.trim()) {
      return {valid: false, message: 'Please enter the admin full name.'};
    }

    if (typeof adminEmail !== 'string' || !adminEmail.trim()) {
      return {valid: false, message: 'Please enter the admin email.'};
    }

    // Simple email regex for validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return {valid: false, message: 'Please enter a valid email address.'};
    }

    if (typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
      return {valid: false, message: 'Please enter the admin phone number.'};
    }

    if (!image) {
      return {valid: false, message: 'Please upload an admin photo.'};
    }

    // If all validations pass
    return {valid: true};
  } catch (error) {
    return {
      valid: false,
      message: 'An unexpected error occurred during validation.',
    };
  }
};

export const companyLegalValidation = ({
  companyName,
  tradeName,
  companyEmail,
  businessType,
  companyImage,
}) => {
  if (!companyName.trim()) {
    return {valid: false, message: 'Please enter the company legal name.'};
  }

  if (!tradeName.trim()) {
    return {valid: false, message: 'Please enter the trade name (DBA).'};
  }

  if (!companyEmail.trim()) {
    return {valid: false, message: 'Please enter the company email.'};
  }

  // Simple email regex for validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(companyEmail)) {
    return {
      valid: false,
      message: 'Please enter a valid company email address.',
    };
  }

  if (!businessType || businessType.length === 0) {
    return {valid: false, message: 'Please select a business type.'};
  }

  if (!companyImage) {
    return {valid: false, message: 'Please upload the company logo.'};
  }

  // If all validations pass
  return {valid: true};
};

export const addAddressValidation = ({selectedCountry, city, postalCode}) => {
  if (!selectedCountry || selectedCountry.length === 0) {
    return {valid: false, message: 'Please select a country.'};
  }

  if (!city.trim()) {
    return {valid: false, message: 'Please enter the city.'};
  }

  if (!postalCode.trim()) {
    return {valid: false, message: 'Please enter the postal code.'};
  }

  // If all validations pass
  return {valid: true};
};

export const addAdditionalDetailsValidation = ({
  zone,
  language,
  subscription,
}) => {
  if (!zone || zone.length === 0) {
    return {valid: false, message: 'Please select a region/zone.'};
  }

  // if (!Language || Language.length === 0) {
  //   return { valid: false, message: 'Please select a language.' };
  // }

  // if (!subscription || subscription.length === 0) {
  //   return { valid: false, message: 'Please select a subscription type.' };
  // }

  return {valid: true};
};
