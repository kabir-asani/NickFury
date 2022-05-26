import humps from "humps";

export const camelCasize = (data: Object): Object => {
    return humps.camelizeKeys(data);
};

export const snakeCasize = (data: Object): Object => {
    return humps.decamelizeKeys(data, { separator: "_" });
};
