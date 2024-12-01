import React, { useState } from 'react';
import accept from '../images/accept.png';
import reject from '../images/reject.png';
import { Link } from 'react-router';

const Verification = () => {
    const [message, setMessage] = useState('');
    const email = new URLSearchParams(window.location.search).get('email');
    const code = new URLSearchParams(window.location.search).get('code');

    fetch(`${process.env.REACT_APP_API_URL}/verifyEmail?email=${email}&code=${code}`)
        .then(response => response.json())
        .then(data => {
            setMessage(data.message);
        })
        .catch((error) => console.error('Error:', error));

    return (
        <div className="verification-page text-center mt-40">
            {message === 'Verification successful!' ? (
                <>
                    <img src={accept} alt="accept" className="mx-auto mb-10 w-24" />
                    <p className='text-xl font-bold'>Your email is verified!</p>
                    <Link to="/calendar" className='text-[#12acec] cursor-pointer hover:text-[#128aec]'>Click here to go to your calendar</Link>
                </>
            ) : (
                <>
                    <img src={reject} alt="accept" className="mx-auto mb-10 w-24" />
                    <p className='text-xl font-bold'>We are unable to verify your account.</p> 
                    <p>Please try again later or contact support if issue persist!</p>
                </>
            )}
        </div>
    );
};

export default Verification;