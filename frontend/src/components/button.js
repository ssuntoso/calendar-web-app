export default function Button(props) {
    return (
        <button
            type={props.type}
            className={`${props.full === "true" ? 'w-full' : ''} px-4 py-2 text-white bg-[#12acec] rounded-md`}
            onClick={props.onClick}
        >
            {props.text}
        </button>
    );
}