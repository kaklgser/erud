import React, { ElementType, HTMLAttributes } from "react";

type CardPadding = "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
  padding?: CardPadding;
}

const paddingMap: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6"
};

const classNames = (...classes: Array<string | undefined | false | null>) =>
  classes.filter(Boolean).join(" ");

export const Card: React.FC<CardProps> = ({
  as: Component = "div",
  padding = "md",
  className,
  children,
  ...rest
}) => {
  return (
    <Component
      className={classNames("card-surface", paddingMap[padding], className)}
      {...rest}
    >
      {children}
    </Component>
  );
};
