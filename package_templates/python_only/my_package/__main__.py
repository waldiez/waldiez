"""Entry point for the package if executed as a module."""

from .cli import app

__all__ = ["app"]

if __name__ == "__main__":
    app()
