import { base64Encode } from '../../common/utils/crypto.js';
export const createVerifyUrl = (link, code, email) => {
    const action = 'validate';
    const token = base64Encode(JSON.stringify({ action, code, email }));
    return `${link}/${token}`;
};
//# sourceMappingURL=auth-utils.js.map