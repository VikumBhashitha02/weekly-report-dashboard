/**
 * Standard API Response Structure
 * Ensures all HTTP responses adhere to a consistent contract:
 * {
 *   success: boolean,
 *   message: string,
 *   data: any,
 *   meta?: object
 * }
 */
class ApiResponse {
  constructor(statusCode, data = null, message = 'Success', meta = null) {
    this.statusCode = statusCode;
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
    this.data = data;
    if (meta) {
      this.meta = meta;
    }
  }

  /**
   * Send JSON response to Express res object
   * @param {import('express').Response} res
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      ...(this.meta ? { meta: this.meta } : {}),
    });
  }

  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    return new ApiResponse(statusCode, data, message, meta).send(res);
  }

  static created(res, data = null, message = 'Created successfully', meta = null) {
    return new ApiResponse(201, data, message, meta).send(res);
  }
}

module.exports = ApiResponse;
