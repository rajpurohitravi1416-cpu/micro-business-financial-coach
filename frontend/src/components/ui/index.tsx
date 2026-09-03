import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'
export function Card({children,className=''}:{children:ReactNode;className?:string}){return <section className={`card ${className}`}>{children}</section>}
export function Button({children,variant='primary',className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'|'ghost'}){return <button className={`button ${variant} ${className}`} {...props}>{children}</button>}
export function Badge({children,tone='neutral'}:{children:ReactNode;tone?:'green'|'amber'|'red'|'neutral'}){return <span className={`badge ${tone}`}>{children}</span>}
export function Input(props:InputHTMLAttributes<HTMLInputElement>){return <input className="input" {...props}/>}
export function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19}/></button></div>{children}</div></div>}
