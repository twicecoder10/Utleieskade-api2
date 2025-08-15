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
<<<<<<< HEAD
              <br>     
              <a style="text-decoration: none;" href="${process.env.UTLEIESKADE_BASE_URL}">Visit us</a> · 
              <a style="text-decoration: none;" href="${process.env.UTLEIESKADE_BASE_URL}/privacy">Privacy policy</a> ·
              <a style="text-decoration: none;" href="${process.env.UTLEIESKADE_BASE_URL}/terms">Terms of use</a>
=======
              <br>
              <a style="text-decoration: none; ${process.env.UTLEIESKADE_BASE_URL}>Visit us</a> . 
              <a style="text-decoration: none; ${process.env.UTLEIESKADE_BASE_URL}>Privacy policy</a> .
              <a style="text-decoration: none; ${process.env.UTLEIESKADE_BASE_URL}>Terms of use</a>
>>>>>>> 6ea9d69bc7970dfce35617e230986892ac113b7f
          </div>
      </body>
      
      </html>`;
}

module.exports = emailTemplate;
