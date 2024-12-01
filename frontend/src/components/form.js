export default function Form({children, title}) {
    return(
        <div className="flex items-center justify-center min-h-[90vh] bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
                <h2 className="text-2xl font-bold text-center">{title}</h2>
                {children}
            </div>
        </div>
    )
}