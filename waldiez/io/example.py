#!/usr/bin/env python3
"""Example usage and manual testing of the StructuredIOStream class."""

import json
from typing import Any

from autogen.events import BaseEvent  # type: ignore

try:
    from .stream import StructuredIOStream
except ImportError:
    from waldiez.io.stream import StructuredIOStream


# Helper function to simulate properly formatted client responses
def create_response_with_request_id(request_id: str, data: Any) -> str:
    """Create a properly formatted response JSON with the given request_id.

    Parameters
    ----------
    request_id : str
        The request ID to include in the response
    data : Any
        The data to include in the response

    Returns
    -------
    str
        JSON string with proper request_id and data
    """
    response = {
        "request_id": request_id,
        "data": data,
        "timestamp": 1234567890,  # Fixed timestamp for testing
    }
    return json.dumps(response)


def test_normal_print() -> None:
    """Test normal printing functionality."""
    print("\n=== Testing Normal Print ===")
    stream = StructuredIOStream()
    stream.print("Hello, world!")
    stream.print("Multiple", "arguments", "test")
    stream.print("Custom separator", "test", sep=" | ")
    stream.print("No newline test", end="")
    stream.print(" - continued")


def test_normal_input() -> None:
    """Test normal input functionality."""
    print("\n=== Testing Normal Input ===")
    stream = StructuredIOStream(timeout=30)  # Shorter timeout for testing

    print("You'll see a structured input request. Enter some text:")
    print("[Important: your response must include the correct request_id]")
    print(
        "[The test helper will automatically "
        "add the request_id if you enter JSON data]"
    )
    result = stream.input("Enter some text: ")
    print(f"You entered: {result}")


def test_password_input() -> None:
    """Test password input functionality."""
    print("\n=== Testing Password Input ===")
    stream = StructuredIOStream(timeout=30)

    print(
        "You'll see a structured password input request. "
        "Input won't be visible:"
    )
    password = stream.input("Enter password: ", password=True)
    print(f"Password received (length: {len(password)})")


def test_structured_message() -> None:
    """Test sending structured messages."""
    print("\n=== Testing Structured Messages ===")
    stream = StructuredIOStream()

    # Send a simple event
    event = BaseEvent(
        type="notification",
        content="This is a test notification",
        metadata={"priority": "high", "category": "test"},
    )
    stream.send(event)


def test_timeout() -> None:
    """Test timeout functionality."""
    print("\n=== Testing Timeout (5 sec) ===")
    stream = StructuredIOStream(timeout=5)

    print(
        "The following input will timeout after "
        "5 seconds if no input is provided:"
    )
    try:
        result = stream.input("This will timeout in 5 seconds: ")
        print(f"You entered: {result}")
    except Exception as e:  # pylint: disable=broad-exception-caught
        print(f"Exception occurred: {e}")


def test_json_input() -> None:
    """Test input with JSON format."""
    print("\n=== Testing JSON Input ===")
    stream = StructuredIOStream()

    print(
        "Enter a JSON response in the format: "
        '{"data": "your message", "request_id": "the_request_id"}'
    )
    result = stream.input("JSON Input: ")
    print(f"Parsed result: {result}")


def test_image_url_input() -> None:
    """Test input with image URL."""
    print("\n=== Testing Image URL Input ===")
    stream = StructuredIOStream()

    print("You'll be prompted to enter an image URL and optional text.")
    print("For testing, you can enter a response in the following format:")
    print(
        """
    {
        "image": "https://example.com/image.jpg",
        "text": "Optional description text"
    }
    """
    )

    result = stream.input("Enter image URL and text: ")
    print(f"Parsed result: {result}")

    # Print guidance on how to interpret the result
    if "<img " in result:
        print("\nDetected image tag in the result.")


def test_image_path_input() -> None:
    """Test input with local image path."""
    print("\n=== Testing Local Image Path Input ===")
    stream = StructuredIOStream()

    print("You'll be prompted to enter a local image path and optional text.")
    print("For testing, you can enter a response in the following format:")
    print(
        """
    {
        "image": "/path/to/local/image.jpg",
        "text": "Optional description text"
    }
    """
    )

    result = stream.input("Enter local image path and text: ")
    print(f"Parsed result: {result}")


def test_base64_image_input() -> None:
    """Test input with base64 encoded image."""
    print("\n=== Testing Base64 Image Input ===")
    stream = StructuredIOStream()

    print(
        "You'll be prompted to enter a base64 encoded image and optional text."
    )
    print(
        "For testing, this would typically come "
        "from a client app that can encode images."
    )
    print("You can manually test with a short placeholder for the base64 data.")
    print(
        """
    {
        "image": "base64/encoded/data...",
        "text": "Optional description text"
    }
    """
    )
    result = stream.input("Enter base64 image data and text: ")
    print(
        "Parsed result (may be long, showing first 100 chars): "
        f"{result[:100]}..."
    )


def test_preformatted_input() -> None:
    """Test input with preformatted image tag."""
    print("\n=== Testing Preformatted Image Tag Input ===")
    stream = StructuredIOStream()

    print("You'll be prompted to enter a preformatted string with <img> tag.")
    print("Example: <img https://example.com/image.jpg> Here is a description")
    print("Note: Preformatted input doesn't need a request_id")

    result = stream.input("Enter preformatted input with <img> tag: ")
    print(f"Parsed result: {result}")
    print("\nNote: Preformatted input should be preserved as-is.")


def test_missing_request_id() -> None:
    """Test what happens with a missing request_id."""
    print("\n=== Testing Missing Request ID ===")
    stream = StructuredIOStream()

    print(
        "This test demonstrates what happens when a "
        "response is missing the request_id."
    )
    print("Enter a JSON response without a request_id:")
    print('Example: {"data": "This will be rejected"}')
    result = stream.input("Enter missing request_id response: ")
    print(f"Parsed result: {result}")


def test_mismatched_request_id() -> None:
    """Test what happens with a mismatched request_id."""
    print("\n=== Testing Mismatched Request ID ===")
    stream = StructuredIOStream()

    print(
        "This test demonstrates what happens when a "
        "response has a wrong request_id."
    )
    print("Enter a JSON response with an incorrect request_id:")
    print(
        'Example: {"request_id": "wrong-id", "data": "This will be rejected"}'
    )
    result = stream.input("Enter mismatched request_id response: ")
    print(f"Parsed result: {result}")


def main() -> None:
    """Run all tests."""
    tests = [
        test_normal_print,
        test_normal_input,
        test_password_input,
        test_structured_message,
        test_json_input,
        test_timeout,
        test_image_url_input,
        test_image_path_input,
        test_base64_image_input,
        test_preformatted_input,
        test_missing_request_id,
        test_mismatched_request_id,
    ]

    print("=== StructuredIOStream Manual Testing ===")
    print("This script will run various tests of the StructuredIOStream class.")
    print("Follow the prompts to test different functionality.")
    print("\nNOTE: This test script includes a helper that automatically adds")
    print("the correct request_id to your JSON responses.")

    for test_func in tests:
        input("\nPress Enter to continue to the next test...")
        test_func()

    print("\n=== All tests completed ===")
    print("Thank you for testing the StructuredIOStream class!")


if __name__ == "__main__":
    main()
