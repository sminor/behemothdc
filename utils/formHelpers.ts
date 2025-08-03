// app/utils/formHelpers.ts
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  export const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const noLeadingOne = cleaned.startsWith('1') ? cleaned.slice(1) : cleaned;
    if (noLeadingOne.length !== 10) return noLeadingOne;
    return `(${noLeadingOne.slice(0, 3)}) ${noLeadingOne.slice(3, 6)}-${noLeadingOne.slice(6)}`;
  };
  
  export const isValidPhoneNumber = (value: string): boolean => {
    const cleaned = value.replace(/\D/g, '');
    const noLeadingOne = cleaned.startsWith('1') ? cleaned.slice(1) : cleaned;
    return noLeadingOne.length === 10;
  };