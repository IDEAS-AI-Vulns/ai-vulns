import sys
import os

print("--- Script starting ---")

try:


    from flask import Flask, jsonify

    # Flask will automatically find this 'app' object
    app = Flask(__name__)

    @app.route('/hello')
    def hello():
        response = {
            "message": "Hello"
        }
        return jsonify(response)

    if __name__ == '__main__':
        port = int(os.environ.get('PORT', 5000))
        app.run(debug=True, host='0.0.0.0', port=port)
except Exception as e:
    print("\n !!! AN ERROR OCCURRED !!! \n")
    print(f"Error Details: {e}")
    # This line is for Windows to prevent the terminal from closing instantly
    input("\nPress Enter to exit...")