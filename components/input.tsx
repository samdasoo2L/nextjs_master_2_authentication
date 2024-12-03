import { InputHTMLAttributes } from "react";

interface InputProps {
  errors?: string[];
  name: string;
}

export default function FormInput({
  errors = [],
  name,
  ...rest
}: InputProps &
  // 킥! 모든 속성을 다 써줄 수 없다! 타입 쉽게 주고, ...rest로 한방에 전달 받자 (name는 필수라서, errors는 input속성X라서)
  InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-2">
      <input
        name={name}
        className="bg-transparent rounded-md w-full h-10 focus:outline-none ring-2 focus:ring-4 transition ring-neutral-200 focus:ring-orange-500 border-none placeholder:text-neutral-400"
        // type={type}
        // placeholder={placeholder}
        // required={required}
        {...rest}
      />
      {errors.map((error, index) => (
        <span key={index} className="text-red-500 font-medium">
          {error}
        </span>
      ))}
    </div>
  );
}
