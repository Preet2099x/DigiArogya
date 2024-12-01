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

export const getDataTypeName = (dataType) => {
    switch (dataType) {
        case 0:
            return 'EHR';
        case 1:
            return 'PHR';
        case 'LAB_RESULT':
            return 'LAB_RESULT';
        case 3:
            return 'PRESCRIPTION';
        case 4:
            return 'IMAGING';
        default:
            return 'NA';
    }
};

