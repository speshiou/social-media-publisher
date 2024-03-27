export function dateStamp() {
    const today = new Date()
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Adding 1 because getMonth() returns zero-based index
    const day = String(today.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
}