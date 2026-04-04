
export default function TrashBin({size=50, className=""}){
    return(
        <div className={`trash-box ${className}`} style={{width:size, height:size}}>
            <div className="trash"></div>
            <div className="trash-top"></div>
            <div className="trash-btm">
                <div className="trash-lines">
                <div className="trash-line"></div>
                <div className="trash-line"></div>
                </div>
            </div>
        </div>
    );
}