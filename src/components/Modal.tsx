"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  account?: boolean;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, children, account = false }: ModalProps) {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      const timeout = setTimeout(() => setShow(false), 300); // match CSS transition
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!show) return null;

  
    return account ? 
      (
        <motion.div
            onClick={onClose}
            className={isOpen ? "" : ""}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </div>
          </motion.div>
      )
      :
      (
        <motion.div
          onClick={onClose}
          className={isOpen ? "nav-modal-open" : "nav-modal-closed"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </motion.div>
      )
    
  ;
}
