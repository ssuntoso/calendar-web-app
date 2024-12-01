import React, { useState } from 'react';
import FormInput from '../components/formInput';
import Button from '../components/button';
import Form from '../components/form';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const backendEndpoint = process.env.REACT_APP_API_URL;

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch(`${backendEndpoint}/forgotPassword?email=${email}`)
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            window.location.href = '/login';
        })
        .catch((error) => console.error('Error:', error));
    };

    return (
        <Form title="Forgot Password">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <FormInput type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required="true" label="Email" />
                <Button type="submit" text="Reset Password" full="true" onClick={handleSubmit}/>
            </form>
        </Form>
    );
};

export default ForgotPasswordPage;