export const getDataTypeEnum = (dataType) => {
    switch (dataType) {
        case 'EHR':
            return 0;
        case 'PHR':
            return 1;
        case 'LAB_RESULT':
            return 2;
        case 'PRESCRIPTION':
            return 3;
        case 'IMAGING':
            return 4;
        default:
            return 1;
    }
};