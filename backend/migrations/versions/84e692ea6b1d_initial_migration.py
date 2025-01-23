"""initial migration

Revision ID: 84e692ea6b1d
Revises: 
Create Date: 2025-01-23 17:20:53.581006

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '84e692ea6b1d'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('users',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=50), nullable=False),
    sa.Column('email', sa.String(length=120), nullable=False),
    sa.Column('google_id', sa.String(length=100), nullable=True),
    sa.Column('photoUrl', sa.String(length=255), nullable=True),
    sa.Column('password_hash', sa.String(length=128), nullable=True),
    sa.Column('role', sa.String(length=20), nullable=False),
    sa.Column('skills', sa.Text(), nullable=True),
    sa.Column('interests', sa.Text(), nullable=True),
    sa.Column('admin', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('google_id'),
    sa.UniqueConstraint('username')
    )
    op.create_table('mentorship_sessions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('mentor_id', sa.Integer(), nullable=False),
    sa.Column('scheduled_time', sa.DateTime(), nullable=False),
    sa.Column('max_attendees', sa.Integer(), nullable=False),
    sa.Column('keywords', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['mentor_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('feedback',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('session_id', sa.Integer(), nullable=False),
    sa.Column('from_user_id', sa.Integer(), nullable=False),
    sa.Column('to_user_id', sa.Integer(), nullable=False),
    sa.Column('rating', sa.Integer(), nullable=False),
    sa.Column('comment', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['from_user_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['session_id'], ['mentorship_sessions.id'], ),
    sa.ForeignKeyConstraint(['to_user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('session_mentees',
    sa.Column('session_id', sa.Integer(), nullable=False),
    sa.Column('mentee_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['mentee_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['session_id'], ['mentorship_sessions.id'], ),
    sa.PrimaryKeyConstraint('session_id', 'mentee_id')
    )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('session_mentees')
    op.drop_table('feedback')
    op.drop_table('mentorship_sessions')
    op.drop_table('users')
    # ### end Alembic commands ###
