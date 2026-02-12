import os
import shutil
import secrets
from datetime import datetime
from typing import List

from fastapi import FastAPI, Request, UploadFile, Form, status
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware

from sqlalchemy import (create_engine, Column, Integer, String, Text, Date, DateTime, Boolean, ForeignKey)
from sqlalchemy.orm import declarative_base, sessionmaker
from jinja2 import contextfunction
from passlib.context import CryptContext

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

DATABASE_URL = os.environ.get('DATABASE_URL') or 'sqlite:///' + os.path.join(BASE_DIR, 'data.db')
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class Item(Base):
    __tablename__ = 'item'
    id = Column(Integer, primary_key=True)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(120), nullable=True)
    found_date = Column(Date, nullable=True)
    image = Column(String(256), nullable=True)
    approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Claim(Base):
    __tablename__ = 'claim'
    id = Column(Integer, primary_key=True)
    item_id = Column(Integer, ForeignKey('item.id'), nullable=False)
    name = Column(String(120), nullable=False)
    email = Column(String(120), nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# create any missing tables after declaring all models
Base.metadata.create_all(engine)

app = FastAPI()
# Allow CORS in development so browser live-servers or different origins can call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Use a session secret from environment for production; fallback to a generated token for dev.
SESSION_SECRET = os.environ.get('SESSION_SECRET') or secrets.token_hex(32)
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)

templates = Jinja2Templates(directory='html')

# Provide get_flashed_messages() for templates
@contextfunction
def _get_flashed_messages(context, with_categories: bool = False):
    request = context.get('request')
    if not request:
        return []
    flashes = request.session.pop('_flashes', []) if request.session.get('_flashes') else []
    if with_categories:
        return flashes
    return [msg for _cat, msg in flashes]

templates.env.globals['get_flashed_messages'] = _get_flashed_messages
templates.env.globals['current_year'] = datetime.utcnow().year

app.mount('/static', StaticFiles(directory='static'), name='static')
app.mount('/uploads', StaticFiles(directory=UPLOAD_FOLDER), name='uploads')

ADMIN_USER = os.environ.get('ADMIN_USER', 'admin')
# Require ADMIN_PASS_HASH (bcrypt) for admin login in this version.
ADMIN_PASS_HASH = os.environ.get('ADMIN_PASS_HASH')

# password hashing/verification context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def flash(request: Request, message: str, category: str = 'info'):
    request.session.setdefault('_flashes', []).append((category, message))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get('/')
def home(request: Request, q: str = '', location: str = None, start_date: str = None, end_date: str = None, page: int = 1, per_page: int = 12):
    db = next(get_db())
    query = db.query(Item).filter(Item.approved == True)
    if q:
        ilike_q = f"%{q}%"
        query = query.filter((Item.title.ilike(ilike_q)) | (Item.description.ilike(ilike_q)))
    if location:
        query = query.filter(Item.location.ilike(f"%{location}%"))
    from datetime import datetime as _dt
    if start_date:
        try:
            sd = _dt.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Item.found_date >= sd)
        except Exception:
            pass
    if end_date:
        try:
            ed = _dt.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Item.found_date <= ed)
        except Exception:
            pass
    items = query.order_by(Item.created_at.desc()).offset((max(page, 1)-1) * per_page).limit(per_page).all()
    return templates.TemplateResponse('home.html', {'request': request, 'items': items, 'q': q, 'location': location, 'start_date': start_date, 'end_date': end_date})


@app.get('/submit')
def submit_get(request: Request):
    return templates.TemplateResponse('submit.html', {'request': request})
@app.post('/submit')
async def submit_post(request: Request):
    form = await request.form()
    title = form.get('title')
    description = form.get('description')
    location = form.get('location')
    found_date = form.get('found_date') or None
    file = form.get('image')
    filename = None
    if file and getattr(file, 'filename', None):
        filename = f"{datetime.utcnow().timestamp()}_{file.filename}"
        path = os.path.join(UPLOAD_FOLDER, filename)
        with open(path, 'wb') as f:
            f.write(await file.read())
    item = Item(title=title, description=description, location=location, image=filename)
    if found_date:
        try:
            item.found_date = datetime.strptime(found_date, '%Y-%m-%d').date()
        except ValueError:
            pass
    db = next(get_db())
    db.add(item)
    db.commit()
    flash(request, 'Item submitted — pending admin approval', 'success')
    return RedirectResponse(url='/', status_code=status.HTTP_303_SEE_OTHER)


@app.get('/item/{item_id}')
def item_detail_get(request: Request, item_id: int):
    db = next(get_db())
    item = db.query(Item).get(item_id)
    if not item:
        return RedirectResponse(url='/', status_code=status.HTTP_302_FOUND)
    claims = db.query(Claim).filter(Claim.item_id == item.id).order_by(Claim.created_at.desc()).all()
    return templates.TemplateResponse('item.html', {'request': request, 'item': item, 'claims': claims})


@app.post('/item/{item_id}')
async def item_detail_post(request: Request, item_id: int):
    form = await request.form()
    name = form.get('name')
    email = form.get('email')
    message = form.get('message')
    db = next(get_db())
    claim = Claim(item_id=item_id, name=name, email=email, message=message)
    db.add(claim)
    db.commit()
    flash(request, 'Claim submitted — admin will contact you', 'success')
    return RedirectResponse(url=f'/item/{item_id}', status_code=status.HTTP_303_SEE_OTHER)


def admin_required(request: Request):
    if not request.session.get('admin'):
        return False
    return True


class ItemCreate(BaseModel):
    title: str
    description: str | None = None
    location: str | None = None
    found_date: str | None = None
    approved: bool | None = None


class ItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    found_date: str | None = None
    approved: bool | None = None


def serialize_item(it: Item):
    return {
        'id': it.id,
        'title': it.title,
        'description': it.description,
        'location': it.location,
        'found_date': it.found_date.isoformat() if it.found_date else None,
        'image_url': f"/uploads/{it.image}" if it.image else None,
        'approved': bool(it.approved),
        'created_at': it.created_at.isoformat() if it.created_at else None,
    }


@app.get('/admin/login')
def admin_login_get(request: Request):
    return templates.TemplateResponse('admin_login.html', {'request': request})


@app.post('/admin/login')
async def admin_login_post(request: Request):
    form = await request.form()
    username = form.get('username')
    password = form.get('password')
    # Enforce ADMIN_PASS_HASH presence
    if not ADMIN_PASS_HASH:
        flash(request, 'Admin password hash not configured. Set ADMIN_PASS_HASH.', 'danger')
        return RedirectResponse(url='/admin/login', status_code=status.HTTP_303_SEE_OTHER)
    valid = False
    if username == ADMIN_USER:
        try:
            valid = pwd_context.verify(password or '', ADMIN_PASS_HASH)
        except Exception:
            valid = False
    if valid:
        request.session['admin'] = True
        flash(request, 'Logged in as admin', 'success')
        return RedirectResponse(url='/admin', status_code=status.HTTP_303_SEE_OTHER)
    flash(request, 'Invalid credentials', 'danger')
    return RedirectResponse(url='/admin/login', status_code=status.HTTP_303_SEE_OTHER)


@app.get('/admin/logout')
def admin_logout(request: Request):
    request.session.pop('admin', None)
    flash(request, 'Logged out', 'info')
    return RedirectResponse(url='/', status_code=status.HTTP_303_SEE_OTHER)


@app.get('/admin')
def admin_dashboard(request: Request):
    if not admin_required(request):
        return RedirectResponse(url=f"/admin/login?next=/admin", status_code=status.HTTP_302_FOUND)
    db = next(get_db())
    items = db.query(Item).order_by(Item.created_at.desc()).all()
    claims = db.query(Claim).order_by(Claim.created_at.desc()).all()
    return templates.TemplateResponse('admin_dashboard.html', {'request': request, 'items': items, 'claims': claims})


@app.get('/api/items')
def api_items(request: Request, q: str = '', location: str = None, approved: bool = True,
              start_date: str = None, end_date: str = None, page: int = 1, per_page: int = 10):
    """JSON API endpoint for items with filtering and pagination."""
    db = next(get_db())
    query = db.query(Item)
    if approved is not None:
        query = query.filter(Item.approved == approved)
    if q:
        ilike_q = f"%{q}%"
        query = query.filter((Item.title.ilike(ilike_q)) | (Item.description.ilike(ilike_q)))
    if location:
        query = query.filter(Item.location.ilike(f"%{location}%"))
    from datetime import datetime as _dt
    if start_date:
        try:
            sd = _dt.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(Item.found_date >= sd)
        except Exception:
            pass
    if end_date:
        try:
            ed = _dt.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(Item.found_date <= ed)
        except Exception:
            pass
    total = query.count()
    items = query.order_by(Item.created_at.desc()).offset((max(page, 1)-1) * per_page).limit(per_page).all()

    def serialize(it):
        return {
            'id': it.id,
            'title': it.title,
            'description': it.description,
            'location': it.location,
            'found_date': it.found_date.isoformat() if it.found_date else None,
            'image_url': f"/uploads/{it.image}" if it.image else None,
            'approved': bool(it.approved),
            'created_at': it.created_at.isoformat() if it.created_at else None,
        }

    return JSONResponse({
        'total': total,
        'page': page,
        'per_page': per_page,
        'items': [serialize(i) for i in items]
    })


@app.post('/api/items')
async def api_create_item(request: Request, payload: ItemCreate):
    if not admin_required(request):
        return JSONResponse({'detail': 'admin required'}, status_code=403)
    db = next(get_db())
    item = Item(title=payload.title, description=payload.description or '', location=payload.location or None)
    if payload.found_date:
        try:
            item.found_date = datetime.strptime(payload.found_date, '%Y-%m-%d').date()
        except Exception:
            pass
    if payload.approved is not None:
        item.approved = bool(payload.approved)
    db.add(item)
    db.commit()
    db.refresh(item)
    return JSONResponse(serialize_item(item), status_code=201)


@app.patch('/api/items/{item_id}')
async def api_update_item(request: Request, item_id: int, payload: ItemUpdate):
    if not admin_required(request):
        return JSONResponse({'detail': 'admin required'}, status_code=403)
    db = next(get_db())
    item = db.query(Item).get(item_id)
    if not item:
        return JSONResponse({'detail': 'not found'}, status_code=404)
    if payload.title is not None:
        item.title = payload.title
    if payload.description is not None:
        item.description = payload.description
    if payload.location is not None:
        item.location = payload.location
    if payload.found_date is not None:
        try:
            item.found_date = datetime.strptime(payload.found_date, '%Y-%m-%d').date()
        except Exception:
            pass
    if payload.approved is not None:
        item.approved = bool(payload.approved)
    db.commit()
    db.refresh(item)
    return JSONResponse(serialize_item(item))


@app.delete('/api/items/{item_id}')
def api_delete_item(request: Request, item_id: int):
    if not admin_required(request):
        return JSONResponse({'detail': 'admin required'}, status_code=403)
    db = next(get_db())
    item = db.query(Item).get(item_id)
    if not item:
        return JSONResponse({'detail': 'not found'}, status_code=404)
    if item.image:
        try:
            os.remove(os.path.join(UPLOAD_FOLDER, item.image))
        except Exception:
            pass
    db.delete(item)
    db.commit()
    return JSONResponse({'detail': 'deleted'})


@app.post('/api/items/upload')
async def api_create_item_upload(request: Request,
                                 title: str = Form(...),
                                 description: str | None = Form(None),
                                 location: str | None = Form(None),
                                 found_date: str | None = Form(None),
                                 approved: str | None = Form(None),
                                 image: UploadFile | None = None):
    if not admin_required(request):
        return JSONResponse({'detail': 'admin required'}, status_code=403)
    db = next(get_db())
    item = Item(title=title, description=description or '', location=location or None)
    if found_date:
        try:
            item.found_date = datetime.strptime(found_date, '%Y-%m-%d').date()
        except Exception:
            pass
    if approved is not None:
        item.approved = approved.lower() in ('1', 'true', 'yes')
    if image and getattr(image, 'filename', None):
        filename = f"{datetime.utcnow().timestamp()}_{image.filename}"
        path = os.path.join(UPLOAD_FOLDER, filename)
        with open(path, 'wb') as f:
            f.write(await image.read())
        item.image = filename
    db.add(item)
    db.commit()
    db.refresh(item)
    return JSONResponse(serialize_item(item), status_code=201)


@app.patch('/api/items/{item_id}/upload')
async def api_update_item_upload(request: Request, item_id: int,
                                 title: str | None = Form(None),
                                 description: str | None = Form(None),
                                 location: str | None = Form(None),
                                 found_date: str | None = Form(None),
                                 approved: str | None = Form(None),
                                 image: UploadFile | None = None):
    if not admin_required(request):
        return JSONResponse({'detail': 'admin required'}, status_code=403)
    db = next(get_db())
    item = db.query(Item).get(item_id)
    if not item:
        return JSONResponse({'detail': 'not found'}, status_code=404)
    if title is not None:
        item.title = title
    if description is not None:
        item.description = description
    if location is not None:
        item.location = location
    if found_date is not None:
        try:
            item.found_date = datetime.strptime(found_date, '%Y-%m-%d').date()
        except Exception:
            pass
    if approved is not None:
        item.approved = approved.lower() in ('1', 'true', 'yes')
    if image and getattr(image, 'filename', None):
        # remove old image
        if item.image:
            try:
                os.remove(os.path.join(UPLOAD_FOLDER, item.image))
            except Exception:
                pass
        filename = f"{datetime.utcnow().timestamp()}_{image.filename}"
        path = os.path.join(UPLOAD_FOLDER, filename)
        with open(path, 'wb') as f:
            f.write(await image.read())
        item.image = filename
    db.commit()
    db.refresh(item)
    return JSONResponse(serialize_item(item))


@app.get('/admin/approve/{item_id}')
def admin_approve(request: Request, item_id: int):
    if not admin_required(request):
        return RedirectResponse(url=f"/admin/login?next=/admin", status_code=status.HTTP_302_FOUND)
    db = next(get_db())
    item = db.query(Item).get(item_id)
    if item:
        item.approved = True
        db.commit()
        flash(request, 'Item approved', 'success')
    return RedirectResponse(url='/admin', status_code=status.HTTP_303_SEE_OTHER)


@app.post('/admin/bulk')
async def admin_bulk(request: Request):
    if not admin_required(request):
        return RedirectResponse(url=f"/admin/login?next=/admin", status_code=status.HTTP_302_FOUND)
    form = await request.form()
    action = form.get('action')
    ids = form.getlist('ids') if hasattr(form, 'getlist') else form.get('ids')
    if not ids:
        flash(request, 'No items selected', 'warning')
        return RedirectResponse(url='/admin', status_code=status.HTTP_303_SEE_OTHER)
    db = next(get_db())
    # normalize ids to list
    if isinstance(ids, str):
        ids = [ids]
    processed = 0
    for sid in ids:
        try:
            iid = int(sid)
        except Exception:
            continue
        item = db.query(Item).get(iid)
        if not item:
            continue
        if action == 'approve':
            item.approved = True
            processed += 1
        elif action == 'delete':
            if item.image:
                try:
                    os.remove(os.path.join(UPLOAD_FOLDER, item.image))
                except Exception:
                    pass
            db.delete(item)
            processed += 1
    db.commit()
    flash(request, f'{processed} items processed', 'success')
    return RedirectResponse(url='/admin', status_code=status.HTTP_303_SEE_OTHER)


@app.get('/admin/delete/{item_id}')
def admin_delete(request: Request, item_id: int):
    if not admin_required(request):
        return RedirectResponse(url=f"/admin/login?next=/admin", status_code=status.HTTP_302_FOUND)
    db = next(get_db())
    item = db.query(Item).get(item_id)
    if item:
        if item.image:
            try:
                os.remove(os.path.join(UPLOAD_FOLDER, item.image))
            except Exception:
                pass
        db.delete(item)
        db.commit()
        flash(request, 'Item deleted', 'info')
    return RedirectResponse(url='/admin', status_code=status.HTTP_303_SEE_OTHER)


if __name__ == '__main__':
    import uvicorn

    uvicorn.run('main:app', host='127.0.0.1', port=8000, reload=True)
