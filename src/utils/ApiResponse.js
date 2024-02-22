class ApiResponse{
    // statuscode yes serves ke kuch statuscode hote hain jo fix hote like 100-200 for this,200-300 for this etc
    constructor(statusCode,data,message="Success"){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode < 400
    }
}
export {ApiResponse}