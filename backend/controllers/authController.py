import random
import string
from fastapi import APIRouter, HTTPException
from models.User import UserCreate, UserLogin
from models.PasswordReset import EmailRequest, CodeVerification, NewPasswordRequest
from database import get_db
import bcrypt
import os
import resend
from dotenv import load_dotenv
from datetime import datetime

router = APIRouter()

load_dotenv()
resend.api_key = os.getenv('RESEND_API_KEY')

# Armazenamento temporário dos códigos enviados
codigo_verificacao = {}

@router.post("/signup")
async def signup(user: UserCreate):
    db = get_db()  
    if db is None:
        raise HTTPException(status_code=500, detail="Banco de dados não conectado.")

    existing_user = await db['DadosPessoais'].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email já está cadastrado.")
    
    hashed_password = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt())

    user_dict = user.dict()
    user_dict["password"] = hashed_password.decode('utf-8')

    await db['DadosPessoais'].insert_one(user_dict)

    return {"message": "Usuário cadastrado com sucesso!"}

@router.post("/login")
async def login(user: UserLogin):
    db = get_db()  
    if db is None:
        raise HTTPException(status_code=500, detail="Banco de dados não conectado.")

    existing_user = await db['DadosPessoais'].find_one({"email": user.email})
    if not existing_user:
        raise HTTPException(status_code=400, detail="Usuário não encontrado.")

    if not bcrypt.checkpw(user.password.encode('utf-8'), existing_user["password"].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Senha incorreta.")

    return {
        "message": "Login realizado com sucesso!",
        "username": existing_user.get("username", ""),
        "userId": str(existing_user["_id"]),  # Convertendo ObjectId para string
        "email": existing_user["email"]
    }


def gerar_codigo():
    return ''.join(random.choices(string.digits, k=6))

async def enviar_codigo_email(email: str, codigo: str):
    try:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Redefinição de Senha</title>
            <style>
                body {{
                    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
                    background-color: #eef3ff;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background-color: #494ce2;
                    padding: 10px 24px;
                    color: white;
                }}
                .header h1 {{
                    font-size: 24px;
                    font-weight: 700;
                    margin: 4px 0;
                }}
                .header p {{
                    color: #e1e9fe;
                    z-index: 10;
                    font-size: 14px;  
                    margin: 4px 0;
                }}
                .content {{
                    padding: 24px;
                    text-align: left;
                    font-size: 16px;
                    line-height: 1.5;
                }}
                .code-container {{
                    background-color: #eef3ff;
                    border-radius: 8px;
                    padding: 18px;
                    text-align: center;
                    margin: 18px 0;
                }}
                .code {{
                    font-size: 32px;
                    font-weight: 700;
                    color: #494ce2;
                    letter-spacing: 2px;
                }}
                .footer {{
                    text-align: center;
                    padding: 12px;
                    font-size: 12px;
                    color: #6b7280;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Redefinição de Senha</h1>
                    <p>Você solicitou a redefinição da sua senha. Utilize o código abaixo para continuar o processo.</p>
                </div>
                <div class="content">
                    <p>Olá,</p>
                    <p>Recebemos uma solicitação para redefinir a senha da sua conta. Utilize o seguinte código de verificação:</p>
                    
                    <div class="code-container">
                        <div class="code">{codigo}</div>
                    </div>
                    
                    <p>Este código é válido por 30 minutos. Se você não solicitou esta alteração, por favor ignore este e-mail.</p>
                    
                    <p>Atenciosamente,<br>Equipe Clube do Limoeiro.</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} Clube do Limoeiro.</p>
                </div>
            </div>
        </body>
        </html>
        """

        await resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": [email],
            "subject": "Seu código de verificação para redefinir senha",
            "html": html_content
        })
    except Exception as e:
        print(f"Erro ao enviar e-mail: {str(e)}")


async def enviar_confirmacao_senha_alterada(email: str):
    try:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Senha Alterada com Sucesso</title>
            <style>
                body {{
                    font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
                    background-color: #eef3ff;
                    margin: 0;
                    padding: 0;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background-color: #494ce2;
                    padding: 10px 24px;
                    color: white;
                }}
                .header h1 {{
                    font-size: 24px;
                    font-weight: 700;
                    margin: 4px 0;
                }}
                .header p {{
                    color: #e1e9fe;
                    font-size: 14px;
                    margin: 4px 0;
                }}
                .content {{
                    padding: 24px;
                    text-align: left;
                    font-size: 16px;
                    line-height: 1.5;
                }}
                .footer {{
                    text-align: center;
                    padding: 12px;
                    font-size: 12px;
                    color: #6b7280;
                }}
                .warning {{
                    background-color: #fff3f3;
                    border-left: 4px solid #ff6b6b;
                    padding: 12px;
                    margin: 18px 0;
                    border-radius: 0 4px 4px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Senha Alterada</h1>
                    <p>Sua senha foi atualizada com sucesso em nossa plataforma.</p>
                </div>
                <div class="content">
                    <p>Olá,</p>
                    
                    <p>A senha da sua conta foi alterada com sucesso em nossa plataforma.</p>
                    
                    <div class="warning">
                        <p><strong>Importante:</strong> Se você não solicitou esta alteração, entre em contato imediatamente com nosso suporte.</p>
                    </div>
                    
                    <p>Agradecemos por utilizar nossos serviços!</p>
                    
                    <p>Atenciosamente,<br>Equipe Clube do Limoeiro.</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} Clube do Limoeiro.</p>
                </div>
            </div>
        </body>
        </html>
        """

        await resend.Emails.send({
            "from": "onboarding@resend.dev",
            "to": [email],
            "subject": "Sua senha foi alterada",
            "html": html_content
        })
    except Exception as e:
        print(f"Erro ao enviar e-mail: {str(e)}")


@router.post("/esqueci-senha")
async def esqueceu_senha(request: EmailRequest):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro de conexão com o banco de dados.")
    
    usuario = await db['DadosPessoais'].find_one({"email": request.email})
    if not usuario:
        raise HTTPException(status_code=404, detail="Este email não está cadastrado !!! Por favor faça uma conta.")

    codigo = gerar_codigo()
    codigo_verificacao[request.email] = codigo
    await enviar_codigo_email(request.email, codigo)

    return {"message": "Verifique seu email"}

@router.post("/verificar-codigo")
async def verificar_codigo(request: CodeVerification):
    codigo_correto = codigo_verificacao.get(request.email)
    if not codigo_correto:
        raise HTTPException(status_code=400, detail="Nenhum código foi enviado para este email.")
    if request.code != codigo_correto:
        raise HTTPException(status_code=400, detail="Código errado")

    return {"message": "Código verificado com sucesso"}

@router.post("/redefinir-senha")
async def redefinir_senha(request: NewPasswordRequest):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Erro de conexão com o banco de dados.")
    
    # Hashing seguro da senha
    hashed_password = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt())

    try:
        # Atualizar senha no banco de dados
        result = await db['DadosPessoais'].update_one(
            {"email": request.email},
            {"$set": {"password": hashed_password.decode('utf-8')}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Falha ao atualizar a senha. Usuário não encontrado.")

        # Remover código de verificação após sucesso
        codigo_verificacao.pop(request.email, None)

        # Enviar email de confirmação
        await enviar_confirmacao_senha_alterada(request.email)

        return {"message": "Senha alterada com sucesso"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno ao redefinir a senha: {str(e)}")