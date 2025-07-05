export interface DetokenizeRequest {
    bestImageToken?: string
    bestImageTokens?: string[]
    transactionId?: string
}

export interface ImageInfo {
    file_name: string
    mime_type: string
    extension: string
    width: number
    height: number
    size: number
    url: string
    jpeg_quality?: number
    is_progressive_jpeg?: boolean
}

export interface DetokenizeResponseData {
    timestamp: string
    file_name: string
    mime_type: string
    extension: string
    width: number
    height: number
    size: number
    preview_url: string
    download_url: string
    imageBuffer: string
    transactionId?: string
    jpeg_quality?: number
    is_progressive_jpeg?: boolean
    tokenIndex?: number
}

export interface DetokenizeResponse {
    success: boolean
    message: string
    data?: DetokenizeResponseData
}

export interface ErrorResponse {
    success: false
    message: string
}
