const readBody = async (data: FormData | Request): Promise<FormData> => {
  if (data instanceof FormData) return data;
  return await data.clone().formData();
};

export const getMultiAction = async (data: FormData | Request, inputName: string = 'intent') => {
  const formData = await readBody(data);
  return formData.get(inputName);
};
