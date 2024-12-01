export default function FormInput(props) {
    return (
        <div>
            <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
                {props.label}
            </label>
            <input
                type={props.type}
                id={props.id}
                value={props.value}
                onChange={props.onChange}
                required
                className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm sm:text-sm"
            />
        </div>
    );
}