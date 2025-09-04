"""Add world chats

Revision ID: 001_add_world_chats
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_add_world_chats'
down_revision = None  # Update this to the latest revision
branch_labels = None
depends_on = None


def upgrade():
    # Create world_chats table
    op.create_table('world_chats',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('world_id', sa.Integer(), nullable=False),
        sa.Column('openai_thread_id', sa.String(length=255), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['world_id'], ['worlds.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('openai_thread_id')
    )
    op.create_index(op.f('ix_world_chats_id'), 'world_chats', ['id'], unique=False)

    # Create world_chat_messages table
    op.create_table('world_chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('world_chat_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('openai_message_id', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['world_chat_id'], ['world_chats.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_world_chat_messages_id'), 'world_chat_messages', ['id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_world_chat_messages_id'), table_name='world_chat_messages')
    op.drop_table('world_chat_messages')
    op.drop_index(op.f('ix_world_chats_id'), table_name='world_chats')
    op.drop_table('world_chats')