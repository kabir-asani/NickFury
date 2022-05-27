import humps from "humps";

export const camelCasize = (data: Object): Object => {
    return humps.camelizeKeys(data);
};

export const snakeCasize = (data: Object): Object => {
    return humps.decamelizeKeys(data, { separator: "_" });
};

export const sentenceCasize = (data: String): String => {
    if (data.length === 0) {
        return data;
    }

    if (data.length === 1) {
        return data.charAt(0).toUpperCase();
    }

    const auxResult = data
        .replace(/([A-Z]+)/g, " $1")
        .replace(/([A-Z][a-z])/g, " $1");

    const result = auxResult.charAt(0).toUpperCase() + auxResult.slice(1);

    return result;
};
