import joblib

# Load the model and vectorizer from the 'models' folder
svm_model = joblib.load('models/svm_model.pkl')
vectorizer = joblib.load('models/vectorizer.pkl')

# Use the model and vectorizer for prediction
def predict(input_data):
    vectorized_input = vectorizer.transform([input_data])
    prediction = svm_model.predict(vectorized_input)
    return prediction
