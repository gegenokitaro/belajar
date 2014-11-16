<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@taglib prefix="sql" uri="http://java.sun.com/jsp/jstl/sql"%>
<%-- 
    Document   : index
    Created on : Oct 27, 2013, 9:23:05 PM
    Author     : kagura
--%>
<sql:query var="subjects" dataSource="jdbc/IFPWAFCAD">
    SELECT subject_id, name FROM Subject
</sql:query>
    

<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
    <head><link rel="stylesheet" type="text/css" href="style.css">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>IFPWAFCAD home page</title>
    </head>
    <body>
        <h1>Welcome to IFPWAFCAD, the International Former Professional Wrestlers' Association for Counseling and Development!</h1>
        <table border="0">
            <thead>
                <tr>
                    <th>IFPWAFCAD offers expert counseling in a wide range of fields.</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>To view the contact details of an IFPWAFCAD certified former
                        professional wrestler in your area, select a subject below:</td>
                </tr>
                <tr>
                    <td><form action="response.jsp">
                            <strong>Select a subject:</strong>
                            <select name="subject_id">
                                <c:forEach var="row" items="${subjects.rows}">
                                    <option value="${row.subject_id}">${row.name}</option>
                                </c:forEach>
                            </select>
                            <input type="submit" value="submit" />
                        </form>
                    </td>
                </tr>
            </tbody>
        </table>

    </body>
</html>
