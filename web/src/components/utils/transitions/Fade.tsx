import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

interface Props {
  in?: boolean;
  children: React.ReactNode;
}

const Fade: React.FC<Props> = (props) => {
  const nodeRef = useRef(null);

  return (
    <CSSTransition in={props.in} nodeRef={nodeRef} classNames="transition-fade" timeout={200} unmountOnExit>
      <div ref={nodeRef} className="inventory-overlay">{props.children}</div>
    </CSSTransition>
  );
};

export default Fade;
