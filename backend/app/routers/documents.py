from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, status

from app import registry
from app.db import Database, get_db
from app.deps import get_current_user
from app.documents import derive_title
from app.documents_schemas import DocumentDetail, DocumentSaveRequest, DocumentSummary
from app.schemas import UserPublic

router = APIRouter(tags=["documents"])


def _summary(row) -> DocumentSummary:
    definition = registry.get_document(row["document_type"])
    form = json.loads(row["form_json"])
    return DocumentSummary(
        id=row["id"],
        documentType=row["document_type"],
        title=derive_title(definition, form) if definition else row["document_type"],
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
    )


def _detail(row) -> DocumentDetail:
    return DocumentDetail(
        **_summary(row).model_dump(),
        form=json.loads(row["form_json"]),
        messages=json.loads(row["messages_json"]),
    )


def _get_owned_row(db: Database, document_id: int, user_id: int):
    """Fetch a row scoped to its owner. Unknown and foreign ids are the same
    404, so the API never leaks whether a document exists for someone else."""
    with db.lock:
        row = db.connection.execute(
            "SELECT * FROM documents WHERE id = ? AND user_id = ?",
            (document_id, user_id),
        ).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
    return row


@router.get("/documents", response_model=list[DocumentSummary])
def list_documents(
    user: UserPublic = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> list[DocumentSummary]:
    with db.lock:
        rows = db.connection.execute(
            "SELECT * FROM documents WHERE user_id = ? ORDER BY updated_at DESC, id DESC",
            (user.id,),
        ).fetchall()
    return [_summary(row) for row in rows]


@router.post("/documents", response_model=DocumentDetail, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentSaveRequest,
    user: UserPublic = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> DocumentDetail:
    with db.lock:
        cursor = db.connection.execute(
            "INSERT INTO documents (user_id, document_type, form_json, messages_json) "
            "VALUES (?, ?, ?, ?)",
            (
                user.id,
                payload.documentType,
                json.dumps(payload.form),
                json.dumps([message.model_dump() for message in payload.messages]),
            ),
        )
        db.connection.commit()
        row = db.connection.execute(
            "SELECT * FROM documents WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return _detail(row)


@router.get("/documents/{document_id}", response_model=DocumentDetail)
def get_document(
    document_id: int,
    user: UserPublic = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> DocumentDetail:
    return _detail(_get_owned_row(db, document_id, user.id))


@router.put("/documents/{document_id}", response_model=DocumentDetail)
def update_document(
    document_id: int,
    payload: DocumentSaveRequest,
    user: UserPublic = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> DocumentDetail:
    with db.lock:
        cursor = db.connection.execute(
            "UPDATE documents SET document_type = ?, form_json = ?, messages_json = ?, "
            "updated_at = datetime('now') WHERE id = ? AND user_id = ?",
            (
                payload.documentType,
                json.dumps(payload.form),
                json.dumps([message.model_dump() for message in payload.messages]),
                document_id,
                user.id,
            ),
        )
        db.connection.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
        row = db.connection.execute(
            "SELECT * FROM documents WHERE id = ?", (document_id,)
        ).fetchone()
    return _detail(row)


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    user: UserPublic = Depends(get_current_user),
    db: Database = Depends(get_db),
) -> None:
    with db.lock:
        cursor = db.connection.execute(
            "DELETE FROM documents WHERE id = ? AND user_id = ?",
            (document_id, user.id),
        )
        db.connection.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found")
