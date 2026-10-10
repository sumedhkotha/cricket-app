import json
import os
import pymongo
import mongomock
from backend.config import settings

_db_instance = None
_is_mock = False
_storage_file = "/tmp/data_store.json" if os.getenv("VERCEL") else os.path.join(os.path.dirname(__file__), "data_store.json")
_bundled_file = os.path.join(os.path.dirname(__file__), "data_store.json")

def get_db():
    global _db_instance, _is_mock
    if _db_instance is not None:
        return _db_instance

    try:
        # Attempt to connect to real MongoDB with a short timeout
        client = pymongo.MongoClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=1500
        )
        # Trigger connection check
        client.admin.command('ping')
        _db_instance = client[settings.DATABASE_NAME]
        _is_mock = False
        print("Connected successfully to MongoDB server at", settings.MONGODB_URI)
    except Exception as e:
        print(f"MongoDB server connection failed ({e}). Falling back to persistent MongoMock engine.")
        mock_client = mongomock.MongoClient()
        _db_instance = mock_client[settings.DATABASE_NAME]
        _is_mock = True
        
        # Load persisted data if exists (check /tmp first on Vercel, else bundled seed file)
        source_file = _storage_file if os.path.exists(_storage_file) else _bundled_file
        if os.path.exists(source_file):
            try:
                with open(source_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for col_name, docs in data.items():
                        if docs:
                            _db_instance[col_name].insert_many(docs)
                print(f"Loaded persistent data from {source_file}")
            except Exception as read_err:
                print(f"Error loading persistent data: {read_err}")

    return _db_instance

def persist_mock_db():
    """Persists mongomock state to disk if running in mock mode."""
    global _db_instance, _is_mock
    if not _is_mock or _db_instance is None:
        return
    try:
        data = {}
        for col_name in _db_instance.list_collection_names():
            docs = list(_db_instance[col_name].find())
            # Convert non-serializable elements
            clean_docs = []
            for d in docs:
                item = dict(d)
                if "_id" in item:
                    item["_id"] = str(item["_id"])
                clean_docs.append(item)
            data[col_name] = clean_docs
            
        with open(_storage_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)
    except Exception as e:
        print(f"Error persisting mock DB: {e}")

# Helper collections accessor
class DBCollections:
    @property
    def users(self):
        return get_db()["users"]
    @property
    def coaches(self):
        return get_db()["coaches"]
    @property
    def plans(self):
        return get_db()["plans"]
    @property
    def subscriptions(self):
        return get_db()["subscriptions"]
    @property
    def video_reviews(self):
        return get_db()["video_reviews"]
    @property
    def ebooks(self):
        return get_db()["ebooks"]
    @property
    def library_items(self):
        return get_db()["library_items"]
    @property
    def payments(self):
        return get_db()["payments"]
    @property
    def earnings(self):
        return get_db()["earnings"]
    @property
    def sessions(self):
        return get_db()["sessions"]
    @property
    def message_threads(self):
        return get_db()["message_threads"]
    @property
    def messages(self):
        return get_db()["messages"]
    @property
    def notifications(self):
        return get_db()["notifications"]
    @property
    def announcements(self):
        return get_db()["announcements"]
    @property
    def announcement_reads(self):
        return get_db()["announcement_reads"]
    @property
    def webhook_events(self):
        return get_db()["webhook_events"]

db = DBCollections()
