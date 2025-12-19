const ResponseUtil = {
  statusCode: null,
  type: null,
  data: null,
  message: null,

  setSuccess(statusCode, message, data) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.type = 'success';
  },

  setError(statusCode, message) {
    this.statusCode = statusCode;
    // Handle different message types
    if (typeof message === 'object' && message !== null) {
      // If it's an object with errors array, format it nicely
      if (message.errors && Array.isArray(message.errors)) {
        const errorMessages = message.errors.map(err => {
          if (typeof err === 'string') return err;
          if (err.msg) return err.msg;
          if (err.message) return err.message;
          return JSON.stringify(err);
        }).join(", ");
        this.message = errorMessages || "Validation error";
      } else if (message.message) {
        this.message = message.message;
      } else {
        this.message = JSON.stringify(message);
      }
    } else {
      this.message = message || "Internal server error";
    }
    this.type = 'error';
  },

  send(res) {
    const result = {
      status: this.type,
      message: this.message,
      data: this.data,
    };

    if (this.type === 'success') {
      return res.status(this.statusCode).json(result);
    }
    return res.status(this.statusCode).json({
      status: this.type,
      message: this.message,
    });
  },
};

module.exports = ResponseUtil;
