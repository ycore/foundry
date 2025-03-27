const readBody = async (data) => {
    if (data instanceof FormData)
        return data;
    return await data.clone().formData();
};
export const getMultiAction = async (data, inputName = 'intent') => {
    const formData = await readBody(data);
    return formData.get(inputName);
};
