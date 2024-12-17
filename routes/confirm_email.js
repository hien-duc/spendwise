const express = require("express");
const router = express.Router();

router.get("/confirm_email", async (req, res) => {
  return res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Confirmed - SpendWise</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            margin: 0;
            padding: 0;
            animation: gradientBG 15s ease infinite;
            background-size: 400% 400%;
          }

          @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .main-container {
            min-height: 100vh;
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.9);
            animation: fadeIn 0.6s ease-out;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          
          .content {
            text-align: center;
            max-width: 600px;
            width: 100%;
            padding: 0 2rem;
          }
          
          .icon {
            width: 120px;
            height: 120px;
            background: #ebf7ee;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 2rem;
            box-shadow: 0 8px 24px rgba(40, 167, 69, 0.15);
          }
          
          .checkmark {
            width: 60px;
            height: 60px;
            position: relative;
          }
          
          .checkmark::before {
            content: '';
            position: absolute;
            width: 36px;
            height: 18px;
            border-left: 6px solid #28a745;
            border-bottom: 6px solid #28a745;
            transform: rotate(-45deg);
            top: 15px;
            left: 12px;
            animation: checkmark 0.4s ease-in-out 0.4s forwards;
            opacity: 0;
          }
          
          @keyframes checkmark {
            from {
              opacity: 0;
              transform: rotate(-45deg) scale(0.8);
            }
            to {
              opacity: 1;
              transform: rotate(-45deg) scale(1);
            }
          }
          
          h1 {
            color: #1a1a1a;
            font-size: 2.5rem;
            margin-bottom: 1.5rem;
            font-weight: 600;
            letter-spacing: -0.5px;
          }
          
          p {
            color: #666;
            line-height: 1.8;
            font-size: 1.1rem;
            margin-bottom: 0.75rem;
          }
          
          .app-name {
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
          }
          
          .logo {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2563eb;
            letter-spacing: -0.5px;
            margin-bottom: 0.5rem;
            display: block;
          }
          
          .success-text {
            color: #28a745;
            font-weight: 500;
            font-size: 1.2rem;
          }
          
          @media (max-width: 768px) {
            h1 {
              font-size: 2rem;
            }
            
            .content {
              padding: 0 1rem;
            }
            
            .icon {
              width: 100px;
              height: 100px;
            }
            
            .checkmark {
              width: 50px;
              height: 50px;
            }
            
            .checkmark::before {
              width: 30px;
              height: 15px;
              border-left: 5px solid #28a745;
              border-bottom: 5px solid #28a745;
              top: 12px;
              left: 10px;
            }
          }
        </style>
      </head>
      <body>
        <div class="main-container">
          <div class="content">
            <div class="icon">
              <div class="checkmark"></div>
            </div>
            <h1>Email Confirmed!</h1>
            <p class="success-text">Your email has been successfully verified</p>
            <p>You can now close this window and log in to your account</p>
            <div class="app-name">
              <span class="logo">SpendWise</span>
              <p>Your Personal Finance Manager</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
});

module.exports = router;
