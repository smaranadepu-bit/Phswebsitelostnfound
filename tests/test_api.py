import os
import shutil
import tempfile
from passlib.context import CryptContext

# Set env before importing the app so main picks up vars
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
ADMIN_PASS = 'testpass'
ADMIN_HASH = pwd.hash(ADMIN_PASS)
os.environ['ADMIN_PASS_HASH'] = ADMIN_HASH
os.environ['ADMIN_USER'] = 'admin'
# use a temporary sqlite file for tests
tmp_db = os.path.join(tempfile.gettempdir(), 'test_data.db')
if os.path.exists(tmp_db):
    try:
        os.remove(tmp_db)
    except Exception:
        pass
os.environ['DATABASE_URL'] = 'sqlite:///' + tmp_db
os.environ['SESSION_SECRET'] = 'testsesssecret'

from fastapi.testclient import TestClient
import main

client = TestClient(main.app)


def test_unauth_create_forbidden():
    # new client without login should be forbidden
    c = TestClient(main.app)
    r = c.post('/api/items', json={
        'title': 'NoAuth', 'description': 'x'
    })
    assert r.status_code == 403


def test_admin_crud_with_upload():
    # login
    r = client.post('/admin/login', data={'username': 'admin', 'password': ADMIN_PASS}, allow_redirects=True)
    assert r.status_code in (200, 303)

    # create via multipart upload endpoint
    files = {'image': ('test.png', b'fakeimagedata', 'image/png')}
    data = {
        'title': 'Test Item',
        'description': 'desc',
        'location': 'TestLoc',
        'found_date': '2026-02-12',
        'approved': 'true'
    }
    r = client.post('/api/items/upload', data=data, files=files)
    assert r.status_code == 201
    obj = r.json()
    assert obj['title'] == 'Test Item'
    assert obj['image_url'] is not None

    item_id = obj['id']

    # update via upload endpoint (change title)
    data2 = {'title': 'Updated Item', 'approved': 'false'}
    r = client.patch(f'/api/items/{item_id}/upload', data=data2)
    assert r.status_code == 200
    obj2 = r.json()
    assert obj2['title'] == 'Updated Item'
    assert obj2['approved'] is False

    # delete
    r = client.delete(f'/api/items/{item_id}')
    assert r.status_code == 200
    assert r.json().get('detail') == 'deleted'


if __name__ == '__main__':
    import pytest

    pytest.main(['-q', __file__])
