import Link from "next/link";
import React, { FC, useState } from "react";
import NavItems from "../utils/NavItems";
import { ThemeSwitcher } from "../utils/ThemeSwitcher";
import { HiOutlineMenuAlt3, HiOutlineUserCircle } from "react-icons/hi";
import CustomModel from "../utils/CustomModel";
import Login from "./Auth/Login";
import Signup from "./Auth/Signup";
import Verification from "./Auth/verification";
type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeItem: number;
};

const Header: FC<Props> = ({ activeItem, setOpen, open }) => {
  const [active, setActive] = useState(false);
  const [openSidebar, setOpenSidebar] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [signupComplete, setSignupComplete] = useState(false);

  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 80) {
        setActive(true);
      } else {
        setActive(false);
      }
    });
  }

  const handleClose = (e: any) => {
    if (e.target.id === "screen") {
      setOpenSidebar(false);
    }
  };

  const handleAuthClick = () => {
    setOpen(true);
    setIsLogin(true);
  };

  const switchAuthMode = () => {
    setIsLogin(!isLogin);
  };

  const handleSignupComplete = () => {
    setSignupComplete(true);
  };

  const goToLogin = () => {
    setIsLogin(true);
    setSignupComplete(false);
  };
  return (
    <div className="w-full relative">
      <div
        className={`
        dark:bg-opacity-50 dark:bg-gradient-to-b dark:from-gray-900 dark:border-[#ffffff1c]  dark:shadow dark:to-black bg-white h-[100px] z-[80] w-full
        ${
          active
            ? "fixed top-0 left-0 border-b shadow-md transition duration-500"
            : "border-b shadow-md"
        }`}
      >
        <div className="w-[95%] 800px:w-[92%] m-auto py-4 h-full">
          <div className="w-full h-[80px] flex items-center justify-between p-3">
            <div>
              <Link
                href={"/"}
                className={
                  "text-[25px] font-Poppins font-[500] text-black dark:text-white"
                }
              >
                AuthO
              </Link>
            </div>
            <div className="flex items-center">
              <NavItems activeItem={activeItem} isMobile={false} />
              <ThemeSwitcher />
              {/* {ONLY FROM MOBILE} */}

              <div className="800px:hidden">
                <HiOutlineMenuAlt3
                  size={25}
                  className="cursor-pointer dark:text-white text-black"
                  onClick={() => {
                    setOpenSidebar(true);
                  }}
                />
              </div>
              <button onClick={handleAuthClick}>
                <HiOutlineUserCircle
                  size={25}
                  className="hidden 800px:block cursor-pointer dark:text-white text-black"
                />
              </button>
            </div>
          </div>
        </div>
        {/* Mobile sidebar */}
        {openSidebar && (
          <div
            className="fixed w-full h-screen top-0 left-0 z-[99999] dark:bg-[unset] bg-[#00000024]"
            onClick={handleClose}
            id="screen"
          >
            <div className="w-[70%] fixed z-[999999999] h-screen bg-white dark:bg-slate-900 dark:bg-opacity-90 top-0 right-0 ">
              <button onClick={handleAuthClick}>
                <HiOutlineUserCircle
                  size={25}
                  className="hidden 800px:block cursor-pointer dark:text-white text-black"
                />
              </button>

              <NavItems activeItem={activeItem} isMobile={true} />

              <p className="text-[16px] px-2 pl-5 text-black dark:text-white">
                Copyright © 2023 AuthO, All rights reserved.
              </p>
            </div>
          </div>
        )}
      </div>
      {open && (
        <>
          <CustomModel
            open={open}
            setOpen={setOpen}
            activeItem={activeItem}
            component={
              signupComplete
                ? () => <Verification goToLogin={goToLogin} />
                : isLogin
                ? () => <Login onSwitch={switchAuthMode} setOpen={setOpen}/>
                : () => (
                    <Signup
                      onSwitch={switchAuthMode}
                      onSignupComplete={handleSignupComplete}
                    />
                  )
            }
          />
        </>
      )}
    </div>
  );
};

export default Header;
