"use client";
import React, { FC, useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { styles } from "../../styles/style";
import { useRouter } from "next/navigation";
import { useRegisterMutation } from "@/redux/features/auth/authApi";
import toast from "react-hot-toast";
type Props = {
  onSwitch: () => void;
  onSignupComplete: () => void;
};

const schema = Yup.object().shape({
  username: Yup.string().required("Please enter a username!"),
  email: Yup.string()
    .email("Invalid email")
    .required(" Please enter your email address"),
  password: Yup.string().required("Please enter your password!").min(8),
});

const Signup: FC<Props> = ({ onSwitch, onSignupComplete }) => {
  const [show, setShow] = useState(false);
  const router = useRouter();
  const [register, {data, error, isSuccess }] = useRegisterMutation();
  useEffect(() => {
    if (isSuccess) {
      const message = data?.message || "Registration successful";
      toast.success(message);
      onSignupComplete();
    }
    if (error) {
      if ("data" in error) {
        const errorData = error as any;
        toast.error(errorData.data.message);
      }
    }
  }, [isSuccess, error]);

  const formik = useFormik({
    initialValues: { username: "", email: "", password: "" },
    validationSchema:schema,
    onSubmit: async ({username,email, password }) => {
      const data = { username, email, password };
      await register(data);
    },
  });

  const { errors, touched, values, handleChange, handleSubmit } = formik;
  return (
    <div className="w-full">
      <h1 className={`${styles.title}`}>Welcome back!</h1>
      <br />

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className={`${styles.label}`} htmlFor="email">
            Enter your username
          </label>
          <input
            type="text"
            name="username"
            value={values.username}
            onChange={handleChange}
            id="username"
            placeholder="amandoe"
            className={`${
              errors.username && touched.username && "border-red-500"
            } ${styles.input}`}
          />
          {errors.username && touched.username && (
            <span className="text-red-500 pt-2 block">{errors.username}</span>
          )}
        </div>
        <label className={`${styles.label}`} htmlFor="email">
          Enter your email
        </label>
        <input
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          id="email"
          placeholder="loginmail@gmail.com"
          className={`${errors.email && touched.email && "border-red-500"} ${
            styles.input
          }`}
        />
        {errors.email && touched.email && (
          <span className="text-red-500 pt-2 block">{errors.email}</span>
        )}

        <div className="w-full mt-5 relative mb-1">
          <label className={`${styles.label}`} htmlFor="email">
            Enter your Password
          </label>
          <input
            type={!show ? "password" : "text"}
            name="password"
            value={values.password}
            onChange={handleChange}
            id="password"
            placeholder="password!@%"
            className={`${
              errors.password && touched.password && "border-red-500"
            } ${styles.input}`}
          />
          {!show ? (
            <AiOutlineEye
              className="absolute bottom-3 right-2 z-1 cursor-pointer"
              size={20}
              onClick={() => setShow(true)}
            />
          ) : (
            <AiOutlineEyeInvisible
              className="absolute bottom-3 right-2 z-1 cursor-pointer"
              size={20}
              onClick={() => setShow(false)}
            />
          )}
        </div>
        {errors.password && touched.password && (
          <span className="text-red-500 pt-2 block">{errors.password}</span>
        )}
        <div className="w-full mt-5">
          <input type="submit" value="Sign Up" className={`${styles.button}`} />
        </div>
        <h5 className="text-center pt-4 font-Poppins text-[14px]">
          Already have any account?
          <span
            className="text-[#2190ff] pl-1 cursor-pointer"
            onClick={onSwitch}
          >
            Login
          </span>
        </h5>
      </form>
    </div>
  );
};

export default Signup;
