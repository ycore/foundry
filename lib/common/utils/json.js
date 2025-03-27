export const mergeJSON = (targetJson, ...mergesJson) => {
    mergesJson.map((mergeJson) => {
        for (const mergeKey in mergeJson) {
            if (Object.prototype.hasOwnProperty.call(mergeJson, mergeKey)) {
                const mergeValue = mergeJson[mergeKey];
                if (typeof mergeValue === 'object' && !Array.isArray(mergeValue) && mergeValue !== null) {
                    if (!targetJson[mergeKey]) {
                        targetJson[mergeKey] = {};
                    }
                    mergeJSON(targetJson[mergeKey], mergeValue);
                }
                else {
                    targetJson[mergeKey] = mergeValue;
                }
            }
        }
    });
    return targetJson;
};
