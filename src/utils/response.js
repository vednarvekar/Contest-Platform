import * as zod from "zod";

export function successResponse(data) {
    return {
        success: true,
        data: data,
        error: null
    };
}

export function failureResponse(errorCode){
    return {
        success: false,
        data: null,
        error: errorCode
    };
}