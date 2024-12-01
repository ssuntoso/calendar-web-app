import React, { useState } from 'react';
import bcrypt from 'bcryptjs';
import Button from '../components/button';
import FormInput from '../components/formInput';
import Form from '../components/form';

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const email = new URLSearchParams(window.location.search).get('email');
    const backendEndpoint = process.env.REACT_APP_API_URL;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password.length < 8 || password.length > 20) {
            alert('Password must be between 8-20 characters');
            return;
        }
        fetch(`${backendEndpoint}/resetPassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                reset_code: new URLSearchParams(window.location.search).get('resetCode'),
                password: bcrypt.hashSync(password, process.env.REACT_APP_HASH_SALT)
            })
        }).then(response => response.json())
            .then(data => {
                alert(data.message);
                window.location.href = '/login';
            })
            .catch((error) => console.error('Error:', error));
    };

    return (
        <Form title="Reset Password">
            <form className="space-y-6" onSubmit={handleSubmit}>
                <FormInput type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required="true" label="New Password" />
                <Button type="submit" text="Reset Password" full="true" onClick={handleSubmit}/>
            </form>
        </Form>
    );
};

export default ResetPasswordPage;