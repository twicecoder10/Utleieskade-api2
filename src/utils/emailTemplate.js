function emailTemplate(header, body) {
  return `<html>
      <body>
          <header>
              <a href=${process.env.UTLEIESKADE_BASE_URL}><img style="float: left;"
                        src=""
                        alt="UTLEIESKADE Logo"></a>
          </header>
          <br><br>
          <h1 style="text-align: center;
          font-family: Arial, sans-serif;">${header}</h1>
          ${body}
          <br>
          <div style="text-align: center;font-family: Arial, sans-serif;">
          <br>
          Utleieskade &#169; 2024. All Rights Reserved.
              <br>
              <a style="text-decoration: none; ${process.env.UTLEIESKADE_BASE_URL}>Visit us</a> . 
              <a style="text-decoration: none; ${process.env.UTLEIESKADE_BASE_URL}>Privacy policy</a> .
              <a style="text-decoration: none; ${process.env.UTLEIESKADE_BASE_URL}>Terms of use</a>
          </div>
      </body>
      
      </html>`;
}

module.exports = emailTemplate;
