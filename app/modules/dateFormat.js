module.exports = function(source, format) {
    if (!source instanceof Date) {
        source = new Date(source);
    }

    let year    = source.getFullYear().toString(),
        month   = (source.getMonth() + 1).toString(),
        date    = source.getDate().toString(),
        hours   = source.getHours().toString(),
        minutes = source.getMinutes().toString(),
        seconds = source.getSeconds().toString();

    month = (month.length > 1) ? month : '0' + month;
    date = (date.length > 1) ? date : '0' + date;
    hours = (hours.length > 1) ? hours : '0' + hours;
    minutes = (minutes.length > 1) ? minutes : '0' + minutes;
    seconds = (seconds.length > 1) ? seconds : '0' + seconds;

    return format
        .replace(/yyyy/g, year)
        .replace(/MM/g, month)
        .replace(/dd/g, date)
        .replace(/hh/g, hours)
        .replace(/mm/g, minutes)
        .replace(/ss/g, seconds);
};