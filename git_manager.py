"""
Git initialization and repository commit script using Dulwich
"""
import os
import dulwich.porcelain as porcelain
from dulwich.repo import Repo

REPO_PATH = os.path.abspath(os.path.dirname(__file__))
REMOTE_URL = "https://github.com/lithigasaravanan86-sudo/my-first-project.git"

def setup_repo():
    print(f"Setting up Git repository in: {REPO_PATH}")

    # Check if .git exists
    git_dir = os.path.join(REPO_PATH, ".git")
    if not os.path.exists(git_dir):
        repo = porcelain.init(REPO_PATH)
        print("Initialized new Git repository.")
    else:
        repo = Repo(REPO_PATH)
        print("Existing Git repository found.")

    # Configure user if not set
    config = repo.get_config()
    try:
        config.get(("user",), "name")
    except KeyError:
        config.set(("user",), "name", b"Lithiga Saravanan")
        config.set(("user",), "email", b"lithigasaravanan86@gmail.com")
        config.write_to_path()
        print("Configured user.name and user.email.")

    # Add all files respecting .gitignore
    porcelain.add(repo, paths=["."])
    print("Staged files.")

    # Status
    status = porcelain.status(repo)
    print("Staged additions:", len(status.staged["add"]))

    # Commit
    try:
        commit_id = porcelain.commit(repo, message=b"Initial commit: College Event Management System (CEMS)")
        print(f"Committed successfully! Commit ID: {commit_id.decode() if isinstance(commit_id, bytes) else commit_id}")
    except Exception as e:
        print(f"Commit note: {e}")

    # Set remote
    try:
        porcelain.remote_add(repo, "origin", REMOTE_URL)
        print(f"Added remote 'origin' -> {REMOTE_URL}")
    except Exception as e:
        print(f"Remote origin status: {e}")

    print("Repository setup complete!")

if __name__ == "__main__":
    setup_repo()
