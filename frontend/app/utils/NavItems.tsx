import Link from "next/link";
import React from "react";

export const navItemsData = [
  {
    name: "Home",
    url: "/",
  }
];

type Props = {
  activeItem: number;
  isMobile: boolean;
};

const NavItems: React.FC<Props> = ({ activeItem, isMobile }) => {
  return (
    <>
      <div className="hidden 800px:flex">
        {navItemsData &&
          navItemsData.map((item, index) => (
            <Link href={`${item.url}`} key={index} passHref>
              <span
                className={`${
                  activeItem === index
                    ? "dark:text-[#37a39a] text-[#4b60e8] "
                    : " dark:text-white text-black hover:opacity-75"
                } text-[18px] px-6 font-Poppins font-[400]`}>
                {item.name}
              </span>
            </Link>
          ))}
      </div>

      {isMobile && (
        <div className="800px:hidden mt-5 ">
          {navItemsData &&
            navItemsData.map((item, index) => (
              <Link href={`${item.url}`} passHref key={index}>
                <span
                  className={`${
                    activeItem === index
                      ? "dark:text-[#37a39a] text-[#4b60e8] "
                      : " dark:text-white text-black hover:opacity-75"
                  } block py-5 text-[18px] px-6 font-Poppins font-[4000] relative`}>
                  {item.name}
                </span>
              </Link>
            ))}
        </div>
      )}
    </>
  );
};

export default NavItems;