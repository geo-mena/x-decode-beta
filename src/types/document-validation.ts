export interface StartDocumentValidationRequest {
    country: string;
    idType: string;
    frontsideImage: string;
    backsideImage: string;
    merchantIdScanReference?: string;
    storeResponses: boolean;
}

export interface CheckValidationStatusRequest {
    scanReference: string;
    storeResponses: boolean;
}

export interface GetValidationDataRequest {
    scanReference: string;
    storeResponses: boolean;
}

export interface DocumentValidationResponse {
    success: boolean;
    data?: Record<string, any>;
    message?: string;
}

export interface ErrorResponse {
    success: false;
    message: string;
}
