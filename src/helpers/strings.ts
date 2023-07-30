export const truncateStr = (str: string, maxChars: number = 15) => {
  return str.length <= maxChars
    ? str
    : `${str.substring(0, maxChars - 1)}[...].${str.split('.')[1]}`;
};

export const replaceFileExtension = (filename: string, extension: string) => {
  const parts = filename.split('.');
  const name = parts[0];

  const newFilename = `${name}.${extension}`;

  return newFilename;
};

export const toDisplayableString = (str: string) => {
  return str[0].toUpperCase() + str.replace('-', ' ').slice(1);
};
