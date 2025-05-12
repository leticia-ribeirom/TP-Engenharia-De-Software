import random
import string
from fastapi import APIRouter, HTTPException
from models.User import UserCreate, UserLogin
from models.PasswordReset import EmailRequest, CodeVerification, NewPasswordRequest
from models.profile import ChangeEmailRequest, ChangePasswordRequest, DeleteAccountRequest
from database import get_db
import bcrypt
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from datetime import datetime


from fastapi import Depends, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from datetime import datetime, timedelta
import secrets

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Configurações JWT
SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

router = APIRouter()

load_dotenv()

# Armazenamento temporário dos códigos enviados
codigo_verificacao = {}

async def enviar_email_boas_vindas(email: str):
    try:
        # Configurações do email
        email_remetente = "es.clube.limoeiro@gmail.com"
        senha_app = os.getenv("GMAIL_APP_PASSWORD")
        
        # Monta o e-mail (HTML)
        mensagem = MIMEMultipart("alternative")
        mensagem["Subject"] = "Bem-vindo ao Clube do Limoeiro!"
        mensagem["From"] = email_remetente
        mensagem["To"] = email

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Bem-vindo ao Clube do Limoeiro</title>
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
                .footer {{
                    text-align: center;
                    padding: 12px;
                    font-size: 12px;
                    color: #6b7280;
                }}
                .highlight {{
                    background-color: #f0f7ff;
                    border-left: 4px solid #494ce2;
                    padding: 12px;
                    margin: 18px 0;
                    border-radius: 0 4px 4px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Bem-vindo ao Clube do Limoeiro!</h1>
                    <p>Sua conta foi criada com sucesso</p>
                </div>
                <div class="content">
                    <p>Olá,</p>
                    <p>É um prazer tê-lo como membro do Clube do Limoeiro! Sua conta foi criada com sucesso.</p>
                    
                    <div class="highlight">
                        <p><strong>Dicas de segurança:</strong></p>
                        <ul>
                            <li>Nunca compartilhe sua senha com ninguém</li>
                            <li>Use uma senha forte e única</li>
                            <li>Ative a verificação em duas etapas se disponível</li>
                        </ul>
                    </div>
                    
                    <p>Agora você pode acessar todos os recursos da nossa plataforma.</p>
                    
                    <p>Atenciosamente,<br>Equipe Clube do Limoeiro.</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} Clube do Limoeiro.</p>
                </div>
            </div>
        </body>
        </html>
        """

        mensagem.attach(MIMEText(html, "html"))

        # Envia via SMTP seguro
        contexto = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=contexto) as servidor:
            servidor.login(email_remetente, senha_app)
            servidor.sendmail(email_remetente, email, mensagem.as_string())

    except Exception as e:
        print(f"Erro ao enviar e-mail de boas-vindas: {str(e)}")
        # Não levantar exceção para não interferir no fluxo de cadastro

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
    
    # Envia email de boas-vindas (não bloqueia o fluxo se falhar)
    try:
        await enviar_email_boas_vindas(user.email)
    except Exception as e:
        print(f"Erro ao enviar email de boas-vindas: {e}")

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

    # Cria token de acesso
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "message": "Login realizado com sucesso!",
        "access_token": access_token,
        "token_type": "bearer",
        "username": existing_user["username"],  # nome do usuário
        "email": existing_user["email"]  # email do usuário
    }


# Adicione no início do arquivo
token_blacklist = set()

@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    # Adiciona o token à blacklist
    token_blacklist.add(token)
    
    return {
        "message": "Logout realizado com sucesso", 
        "redirect": "/login"
    }


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Verifica se o token está na blacklist
        if token in token_blacklist:
            raise credentials_exception
            
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db = get_db()
    user = await db['DadosPessoais'].find_one({"email": email})
    if user is None:
        raise credentials_exception
        
    return user


@router.post("/protegido")
async def rota_protegida(current_user: dict = Depends(get_current_user)):
    return {"message": "Voce esta autenticado!", "user": current_user["email"]}


def gerar_codigo():
    return ''.join(random.choices(string.digits, k=6))

async def enviar_codigo_email(email: str, codigo: str):
    try:
        # Configurações do email
        email_remetente = "es.clube.limoeiro@gmail.com"
        senha_app = os.getenv("GMAIL_APP_PASSWORD")
        
        # Monta o e-mail (HTML)
        mensagem = MIMEMultipart("alternative")
        mensagem["Subject"] = "Seu código de verificação para redefinir senha"
        mensagem["From"] = email_remetente
        mensagem["To"] = email

        html = f"""
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

        mensagem.attach(MIMEText(html, "html"))

        # Envia via SMTP seguro
        contexto = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=contexto) as servidor:
            servidor.login(email_remetente, senha_app)
            servidor.sendmail(email_remetente, email, mensagem.as_string())

    except Exception as e:
        print(f"Erro ao enviar e-mail: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao enviar e-mail: {str(e)}")


async def enviar_confirmacao_senha_alterada(email: str):
    try:
        # Configurações do email
        email_remetente = "es.clube.limoeiro@gmail.com"
        senha_app = os.getenv("GMAIL_APP_PASSWORD")
        
        # Monta o e-mail (HTML)
        mensagem = MIMEMultipart("alternative")
        mensagem["Subject"] = "Sua senha foi alterada"
        mensagem["From"] = email_remetente
        mensagem["To"] = email

        html = f"""
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

        mensagem.attach(MIMEText(html, "html"))

        # Envia via SMTP seguro
        contexto = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=contexto) as servidor:
            servidor.login(email_remetente, senha_app)
            servidor.sendmail(email_remetente, email, mensagem.as_string())

    except Exception as e:
        print(f"Erro ao enviar e-mail: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao enviar e-mail: {str(e)}")


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


@router.put("/profile/change-email")
async def change_email(
    request: ChangeEmailRequest, 
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Banco de dados não conectado.")
    
    # 1️⃣ Verificar se a senha atual está correta
    user_data = await db['DadosPessoais'].find_one({"email": current_user["email"]})
    if not user_data or not pwd_context.verify(request.current_password, user_data["password"]):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")
    
    # 2️⃣ Verificar se o novo email já está em uso
    existing_user = await db['DadosPessoais'].find_one({"email": request.new_email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Este email já está em uso.")
    
    # 3️⃣ Verificar se o novo email é diferente do atual
    if request.new_email == current_user["email"]:
        raise HTTPException(status_code=400, detail="O novo email deve ser diferente do atual.")
    
    # 4️⃣ Atualizar o email no banco de dados
    result = await db['DadosPessoais'].update_one(
        {"email": current_user["email"]},
        {"$set": {"email": request.new_email}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Falha ao atualizar o email.")
    
    # 5️⃣ Gerar novo token JWT com o novo email
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": request.new_email}, expires_delta=access_token_expires
    )
    
    return {
        "message": "Email alterado com sucesso!",
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.put("/profile/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Banco de dados não conectado.")
    
    if not bcrypt.checkpw(request.current_password.encode(), current_user["password"].encode()):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    
    hashed = bcrypt.hashpw(request.new_password.encode(), bcrypt.gensalt())

    # Atualizar a senha
    await db['DadosPessoais'].update_one(
        {"email": current_user["email"]},
        {"$set": {"password": hashed.decode('utf-8')}}
    )
    
    # Enviar email de confirmação
    await enviar_confirmacao_senha_alterada(current_user["email"])
    
    return {"message": "Senha alterada com sucesso!"}


@router.delete("/profile/delete-account")
async def delete_account(
    request: DeleteAccountRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Banco de dados não conectado.")
    
    # Verificar a senha antes de deletar
    if not bcrypt.checkpw(
        request.password.encode('utf-8'), 
        current_user["password"].encode('utf-8')
    ):
        raise HTTPException(status_code=400, detail="Senha incorreta. A conta não foi deletada.")
    
    # Deletar a conta
    result = await db['DadosPessoais'].delete_one({"email": current_user["email"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=400, detail="Falha ao deletar a conta.")
    
    return {
        "message": "Conta deletada com sucesso.", 
        "redirect": "/login"
    }
